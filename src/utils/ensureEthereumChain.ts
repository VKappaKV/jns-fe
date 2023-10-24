// Switches chain to the requested chain ID if necessary, rejects if unsuccessful.
import { PhantomEthereumProvider, SupportedEVMChainIds } from '../types';
import getEthereumChain from './getEthereumChain';
import switchEthereumChain from './switchEthereumChain';

export const ensureEthereumChain = async (
  provider: PhantomEthereumProvider,
  chainId: SupportedEVMChainIds
): Promise<boolean> => {
  const curChainId = await getEthereumChain(provider);
  if (curChainId === chainId) {
    return true;
  }

  try {
    await switchEthereumChain(provider, chainId);
    return true;
  } catch (error) {
    console.log("Error in switchEthereumChain " + error.message);
    return false;
  }
};
